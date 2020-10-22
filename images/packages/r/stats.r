# R script for downloading and analysing R package download statistics
# from http://cran-logs.rstudio.com/

# Number of days over which to analyse stats
days <- 14

# Percentiles to output
percentiles <- c(80, 90, 95, 99)

library(dplyr)
library(ggplot2)

data_file <- "data.tsv"
if (file.exists(data_file)) {
  # Data file exists so just read it in
  data <- read.table(data_file, sep="\t", header=TRUE)
} else {
  # Define data range and associated URLs to download
  end <- as.Date(Sys.time()) - 3 # It can take some days for logs to be available
  begin <- end - days
  dates <- seq(begin, end, by="day")
  filenames <- strftime(dates, "%Y-%m-%d.csv.gz")

  # Get data by day, count downloads by package and
  # append to data. Better to aggregate by date first
  # because of the large size of the daily logs.
  data <- NULL
  dir.create("logs", showWarnings=FALSE)
  for (filename in filenames) {
    path <- file.path("logs", filename)
    if(!file.exists(path)) {
      url <- paste0("http://cran-logs.rstudio.com/", substr(filename, 1, 4), '/', filename)
      download.file(url, path)
    }
    day <- read.csv(path)
    counts <- day %>% group_by(package) %>% count(name="count")
    data <- rbind(data, counts)
  }

  # Save data for use again
  write.table(data, data_file, sep="\t", quote=FALSE, row.names=F)
}

# Count by package
counts <- data %>% group_by(package) %>% summarise(count=sum(count), .groups="keep") %>% arrange(-count)

# Calculate rank and percentile
counts <- within(counts, {
  rank <- 1:nrow(counts)
  percentile <- diffinv(count)[-1] / sum(count) * 100
})

# Plot stats
plot <- counts %>%
  head(1000) %>%
  ggplot(aes(x=rank, y=percentile)) +
  geom_line() +
  geom_hline(yintercept=percentiles, linetype=2, colour="grey") +
  labs(x="Rank of package", y="Percentile or package")
ggsave("stats.png", plot)

# Write stats
counts %>%
  select(package, rank, percentile) %>%
  write.table("stats.tsv", sep="\t", quote=FALSE, row.names=F)

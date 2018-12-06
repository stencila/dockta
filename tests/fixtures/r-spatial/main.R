library(rgdal)
library(sp)

# Read in the shape file
philly <- readOGR(dsn="Philly3/Philly3.shp")

# Plot homicide rate
png('plot.png')
spplot(philly, "HOMIC_R")

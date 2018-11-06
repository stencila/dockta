library(rgdal)
library(sp)

# Read in the shape file
philly <- readOGR(dsn="Philly3/Philly3.shp")

# Plot homicide rate and percent college graduates
png('homicide-college.png')
spplot(philly, c("HOMIC_R", "PCT_COL"))

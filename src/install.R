#!/usr/bin/env Rscript

# A R script which installs the packages (and their dependencies) listed
# under Imports in a R package DESCRIPTION file.
#
# Sets up a local R package repository and installs from there and a
# snapshot of CRAN at the date specified in the DESCRIPTION file
#
# It is necessary to go to the extent of creating a local R repository because `install.packages`
# on a source package, *with* an external repo for dependencies i.e.
#
#    install.packages("mypackage.tar.gz", type="source", repos="https://mran.microsoft.com/snapshot/2017-10-01/")
# 
# does not work. For further discussion see:
#
#   https://stackoverflow.com/questions/25017195/install-a-local-r-package-with-dependencies-from-cran-mirror
#   https://stackoverflow.com/questions/38732493/automatically-install-dependent-libraries-for-a-self-made-package 

# Read in the package description
desc <- as.data.frame(read.dcf('DESCRIPTION'))

# Create a temporary, local R package repository
repo <- file.path(tempdir(), 'repo')
src <- file.path(repo, 'src', 'contrib')
dir.create(src, recursive=TRUE, showWarnings=FALSE)

# Copy just the description file into it
file.copy('DESCRIPTION', file.path(src, 'DESCRIPTION'))

# Change to the repo
setwd(src)

# Build the package and repo package index
tools::Rcmd(c("build", "."))
tools::write_PACKAGES(".")

# Install the package from the local repo
install.packages(
    desc$Package,
    repos=c(
        paste0("file:", repo),
        paste0("https://mran.microsoft.com/snapshot/", desc$Date)
    )
)

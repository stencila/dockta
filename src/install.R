#!/usr/bin/env Rscript

# Rscript -e 'install.packages("mypackage.tar.gz", type="source", repos="https://mran.microsoft.com/snapshot/2017-10-01/", dependencies="Imports")'
#
# https://stackoverflow.com/questions/25017195/install-a-local-r-package-with-dependencies-from-cran-mirror
# https://stackoverflow.com/questions/38732493/automatically-install-dependent-libraries-for-a-self-made-package

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

# Install the local package
install.packages(
    desc$Package,
    repos=c(
        paste0("file:", repo),
        paste0("https://mran.microsoft.com/snapshot/", desc$Date)
    ),
    dependencies="Imports"
)

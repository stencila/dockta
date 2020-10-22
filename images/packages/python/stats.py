# Python script for downloading and analysing PyPI download statistics
# See https://packaging.python.org/guides/analyzing-pypi-package-downloads/

import pandas_gbq

# Get the data
query = """
SELECT
  file.project AS package,
  COUNT(*) AS count,
FROM `the-psf.pypi.downloads*`
WHERE
  _TABLE_SUFFIX
    BETWEEN FORMAT_DATE('%Y%m01', DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
        AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
GROUP BY
  file.project
ORDER BY
  count DESC
LIMIT 10000
"""
counts = pandas_gbq.read_gbq(query, project_id="stencila-general", dialect="standard")

# Calculate rank and percentile
counts["rank"] = range(1, len(counts) + 1)
counts["percentile"] = (counts["count"].cumsum() / counts["count"].sum()) * 100

# Plot stats
counts.head(1000).plot(
    x="rank", y="percentile", xlabel="Rank of package", ylabel="Percentile or package"
).get_figure().savefig("stats.png")

# Write stats
counts.to_csv(
    "stats.tsv", columns=("package", "rank", "percentile"), sep="\t", index=False
)

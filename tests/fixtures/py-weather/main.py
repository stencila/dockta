# A script to download temperature data from the Australian Bureau of Metereology for Adelaide airport
# and plot it

import datetime
import io
import matplotlib.pyplot as plt
import pandas
import urllib
import zipfile

# Get the zipped data
url = "http://www.bom.gov.au/jsp/ncc/cdio/weatherData/av?p_display_type=dailyZippedDataFile&p_stn_num=023034&p_c=-106107466&p_nccObsCode=122"
request = urllib.request.Request(url, headers={'User-Agent' : 'Python'}) 
response = urllib.request.urlopen(request)

# Unzip it and read it into a pandas data frame
with zipfile.ZipFile(io.BytesIO(response.read())) as zip:
   with zip.open("IDCJAC0010_023034_1800_Data.csv") as file:
      data = pandas.read_csv(file, header=0)

# Calculate the day of year
data['date'] = [datetime.datetime(row.Year, row.Month, row.Day) for index, row in data.iterrows()]
data['doy'] = [row.date.timetuple().tm_yday for index, row in data.iterrows()]

# Aggregate data by the day of year
ax1 = data.plot(x='doy', y='Maximum temperature (Degree C)', c='Year', s=10, kind='scatter')
data[data.Year == 2019].plot(x='doy', y='Maximum temperature (Degree C)', c='Red', kind='scatter', ax=ax1)
ax1.set(xlabel="Day of year")

# Save plot
fig = plt.gcf()
fig.savefig('temp-by-day-of-year.png')

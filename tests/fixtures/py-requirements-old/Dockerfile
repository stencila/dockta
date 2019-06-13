FROM ubuntu:18.04

RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y \
      python3 \
      python3-pip \
 && apt-get autoremove -y \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# dockta

ADD requirements.txt .
RUN pip3 install -r requirements.txt

ADD cmd.py .
CMD python3 cmd.py

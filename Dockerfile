FROM nikolaik/python-nodejs:python3.12-nodejs18-slim 
RUN python3 -m venv /opt/venv/beskid && pip install numpy torch
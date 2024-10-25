FROM nikolaik/python-nodejs:python3.12-nodejs18-slim
ENV PATH="/opt/venv/beskid/bin:$PATH"
ENV scriptDir="/app/python"
RUN python3 -m venv /opt/venv/beskid && pip install --no-cache-dir numpy torch==2.5.0+cpu --extra-index-url https://download.pytorch.org/whl/cpu
USER pn
WORKDIR /home/pn

ARG PYTHON_IMAGE=python:3.12.9-slim-bookworm
ARG SANDBOX_CODE_SERVER_IMAGE=codercom/code-server:latest
FROM ${PYTHON_IMAGE} AS python-runtime

FROM ${SANDBOX_CODE_SERVER_IMAGE}

USER root
ENV TZ=Asia/Shanghai

WORKDIR /home/coder/code_gen

COPY docker/start.sh /usr/local/bin/start-sandbox.sh
RUN chmod +x /usr/local/bin/start-sandbox.sh

RUN if [ -f /etc/apt/sources.list.d/debian.sources ]; then \
      sed -i 's@deb.debian.org@mirrors.aliyun.com@g' /etc/apt/sources.list.d/debian.sources; \
    fi && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
      pkg-config \
      gcc \
      libmariadb-dev \
      netcat-openbsd \
      fonts-wqy-zenhei && \
    rm -rf /var/lib/apt/lists/*

COPY --from=python-runtime /usr/local/ /usr/local/

RUN /usr/local/bin/python3.12 --version && \
    /usr/local/bin/python3.12 -m venv /home/coder/venv && \
    /home/coder/venv/bin/pip install --upgrade pip --index-url https://mirrors.aliyun.com/pypi/simple/

ENV POETRY_VERSION=2.2.1
ENV PATH="/home/coder/venv/bin:$PATH"

RUN pip install --no-cache-dir poetry==${POETRY_VERSION} -i https://mirrors.aliyun.com/pypi/simple/

COPY pyproject.toml poetry.lock ./

RUN poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi --without dev

COPY . .

RUN cp .vscode/settings.json.template .vscode/settings.json && \
    sed -i 's|/home/coder/venv/bin/python3.11|/usr/local/bin/python3.12|g' .vscode/settings.json && \
    mkdir -p /home/coder/.config/code-server

RUN if [ -f /home/coder/code_gen/config.yaml ]; then \
      cp /home/coder/code_gen/config.yaml /home/coder/.config/code-server/config.yaml; \
    fi && \
    chown -R coder:coder /home/coder

USER coder

RUN if [ -f /home/coder/code_gen/python.vsix ]; then \
      HOME=/home/coder code-server --install-extension /home/coder/code_gen/python.vsix --force; \
    fi && \
    if [ -f /home/coder/code_gen/python.debugpy.vsix ]; then \
      HOME=/home/coder code-server --install-extension /home/coder/code_gen/python.debugpy.vsix --force; \
    fi

WORKDIR /home/coder
EXPOSE 8080 8000
ENTRYPOINT ["/usr/local/bin/start-sandbox.sh"]

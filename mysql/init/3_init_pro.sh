#!/bin/bash
set -e

# 等待 MySQL 完全启动 (虽然 entrypoint 会按顺序执行，但保险起见)
echo "Initializing atlas_pro database with schema..."

# 将 1 和 2 号 SQL 文件导入到 atlas_pro
# 注意：这里假设你的 SQL 文件里没有强制 "USE atlas_dev"，如果有，需要修改 SQL 文件或使用 sed 替换
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" atlas_pro < /docker-entrypoint-initdb.d/1.dataos_mini_ontology_base_v1.0.0_mysql_init-20251001.sql
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" atlas_pro < /docker-entrypoint-initdb.d/2.dataos_mini_ontology_v1.0.0_mysql_init-20260107.sql

echo "atlas_pro initialization complete."

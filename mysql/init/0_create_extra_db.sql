-- 创建第二个数据库
CREATE DATABASE IF NOT EXISTS atlas_pro DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- 确保 ontology 用户对 atlas_pro 有权限
GRANT ALL PRIVILEGES ON atlas_pro.* TO 'ontology'@'%';
FLUSH PRIVILEGES;

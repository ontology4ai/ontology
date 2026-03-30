-- 为关系类型添加关系类型约束字段
ALTER TABLE ontology_link_type ADD COLUMN relation_constraint_type VARCHAR(50) COMMENT '关系类型约束: FUNCTIONAL(函数型), REFLEXIVE(自反型), SYMMETRIC(对称型), TRANSITIVE(传递型)';
ALTER TABLE ontology_link_type_his ADD COLUMN relation_constraint_type VARCHAR(50) COMMENT '关系类型约束: FUNCTIONAL(函数型), REFLEXIVE(自反型), SYMMETRIC(对称型), TRANSITIVE(传递型)';
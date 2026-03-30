<TabPane
                                    key="service"
                                    title="发起请求">
                                    <Form
                                        layout="vertical"
                                        labelAlign="left"
                                        initialValues={action.builtIn}
                                        onValuesChange={this.onServiceActionsChange}>
                                        <Form.Item>
                                            <Form.List
                                                field="serviceActions">
                                                {(services, { add, remove, move }) => {
                                                    return (
                                                        <>
                                                            <Tabs
                                                                editable
                                                                type='card-gutter'
                                                                activeTab={this.state.serviceActiveTab}
                                                                onAddTab={() => {
                                                                    add();
                                                                    console.log(services);
                                                                }}
                                                                onDeleteTab={(key) => {
                                                                    console.log(key);
                                                                    remove(Number(key));
                                                                }}
                                                                onChange={this.setServiceActiveTab}>
                                                                {
                                                                    services.map((service, index) => {
                                                                        return (
                                                                            <TabPane
                                                                                destroyOnHide
                                                                                key={index}
                                                                                title={`服务-` + (index + 1)}
                                                                                style={{
                                                                                    padding: '10px'
                                                                                }}>
                                                                                <Form.Item
                                                                                    field={service.field + '.condition'}
                                                                                    label="触发条件">
                                                                                    <Input />
                                                                                </Form.Item>
                                                                                <Form.Item
                                                                                    label="是否显示动作确认弹框"
                                                                                    triggerPropName="checked"
                                                                                    field={service.field + '.showConfirm'}>
                                                                                    <Switch />
                                                                                </Form.Item>
                                                                                <Form.Item
                                                                                    label="服务"
                                                                                    field={service.field + '.url'}>
                                                                                    <Input />
                                                                                </Form.Item>
                                                                                <Form.Item
                                                                                    label="服务占位符"
                                                                                    field={service.field + '.placeholders'}>
                                                                                    <TableForm />
                                                                                </Form.Item>
                                                                                <Form.Item
                                                                                    label="发送数据"
                                                                                    field={service.field + '.data'}>
                                                                                    <Editor />
                                                                                </Form.Item>
                                                                                <Form.Item
                                                                                    label="发送请求前调用函数处理数据"
                                                                                    field={service.field + '.before'}>
                                                                                    <Editor />
                                                                                </Form.Item>
                                                                                <Form.Item
                                                                                    label="请求成功后执行视图其他组件内置函数"
                                                                                    field={service.field + '.successActions'}>
                                                                                    <TableForm />
                                                                                </Form.Item>
                                                                                <Form.Item
                                                                                    label="请求成功后调用函数"
                                                                                    field={service.field + '.success'}>
                                                                                    <Editor />
                                                                                </Form.Item>
                                                                                <Form.Item
                                                                                    label="请求成功提示消息"
                                                                                    field={service.field + '.successMsg'}>
                                                                                    <Input.TextArea />
                                                                                </Form.Item>
                                                                                <Form.Item
                                                                                    label="请求失败后调用函数"
                                                                                    field={service.field + '.fail'}>
                                                                                    <Editor />
                                                                                </Form.Item>
                                                                                <Form.Item
                                                                                    label="请求失败提示消息"
                                                                                    field={service.field + '.failMsg'}>
                                                                                    <Input.TextArea />
                                                                                </Form.Item>
                                                                            </TabPane>
                                                                        )
                                                                    })
                                                                 }
                                                            </Tabs>
                                                        </>
                                                    )
                                                }}
                                            </Form.List>
                                        </Form.Item>
                                    </Form>
                                </TabPane>;

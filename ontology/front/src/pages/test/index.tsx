import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import useLocale from 'modo-plugin-common/src/utils/useLocale';
import { Button } from '@arco-design/web-react';
import i18n from './locale';
import { getTeamTreeData } from './api';

const Test = (props) => {
	const t = useLocale();
	const loginT = useLocale(i18n);

	useEffect(() => {
	    getTeamTreeData();
	}, []);
	return (
		<div
			className="test">
			{loginT('测试第三方页面')}
			---------
			{props.identity.userId}
			<Button>{t('查询')}</Button>
		</div>
	)
};

export default connect(state => ({
  identity: state.identity,
}))(Test);

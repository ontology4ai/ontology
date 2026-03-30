export default () => {
    const paths = window.location.pathname.split('/');
    if (paths[1] === 'modo') {
        return 'design';
    } else {
        return 'publish';
    }
};

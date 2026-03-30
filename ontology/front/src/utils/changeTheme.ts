function changeTheme(theme: string) {
  if (theme !== 'modo') {
    document.body.setAttribute('modo-theme', theme);
  } else {
    document.body.setAttribute('modo-theme', 'modo');
  }
}

export default changeTheme;

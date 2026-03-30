const chalk = require('chalk');
const os = require('os');
const { exec } = require('child_process');

const log = (message) => console.log(chalk.green(`${message}`));
const successLog = (message) => console.log(chalk.blue(`${message}`));
const errorLog = (error) => console.log(chalk.red(`${error}`));

const execute = (cmd) => {
    exec(cmd, (error, stdout, stderr) => {
        // log(`${cmd}`);
        if (error) {
            errorLog(error);
        } else {
            // successLog('成功');
        }
    });
};

const params = `cp -r public/static/lib dist/_resource_ &&
                cp -r public/static/Avitor.md dist/_resource_`;

if (os.type() === 'Windows_NT') {
    // windows
    execute('xcopy  .\\public\\static  .\\dist\\_resource_ /e /y /i /q /d');
} else if (os.type() === 'Darwin') {
    // mac
    execute(`${params}`);
} else if (os.type() === 'Linux') {
    // Linux
    execute(`${params}`);
} else {
    // 不支持提示
    errorLog('不支持该操作系统');
}

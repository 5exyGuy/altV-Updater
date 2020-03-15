import request from 'request';
import fs from 'fs';
import ProgressBar from 'progress';
import path from 'path';
import readline from 'readline';
const platform = process.platform === 'win32' ? 'windows' : 'linux';
const __dirname = path.resolve(path.dirname(''));

const windowsURLS = (build) => { 
    return [
        {
            url: `https://cdn.altv.mp/node-module/${build}/x64_win32/update.json`,
            destination: '.'
        },
        {
            url: `https://cdn.altv.mp/node-module/${build}/x64_win32/modules/node-module.dll`,
            destination: './modules'
        },
        {
            url: `https://cdn.altv.mp/node-module/${build}/x64_win32/libnode.dll`,
            destination: '.'
        },
        {
            url: `https://cdn.altv.mp/server/${build}/x64_win32/altv-server.exe`,
            destination: '.'
        },
        {
            url: `https://cdn.altv.mp/server/${build}/x64_win32/data/vehmodels.bin`,
            destination: './data'
        },
        {
            url: `https://cdn.altv.mp/server/${build}/x64_win32/data/vehmods.bin`,
            destination: './data'
        }
    ];
};

const linuxURLS = (build) => { 
    return [
        {
            url: `https://cdn.altv.mp/node-module/${build}/x64_linux/update.json`,
            destination: '.'
        },
        {
            url: `https://cdn.altv.mp/node-module/${build}/x64_linux/modules/libnode-module.so`,
            destination: './modules'
        },
        {
            url: `https://cdn.altv.mp/node-module/${build}/x64_linux/libnode.so.72`,
            destination: '.'
        },
        {
            url: `https://cdn.altv.mp/server/${build}/x64_linux/altv-server`,
            destination: '.'
        },
        {
            url: `https://cdn.altv.mp/server/${build}/x64_linux/data/vehmodels.bin`,
            destination: './data'
        },
        {
            url: `https://cdn.altv.mp/server/${build}/x64_linux/data/vehmods.bin`,
            destination: './data'
        },
        {
            url: `https://cdn.altv.mp/others/start.sh`,
            destination: '.'
        }
    ];
};

const color = {
    Reset: "\x1b[0m",
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    Underscore: "\x1b[4m",
    Blink: "\x1b[5m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",

    FgBlack: "\x1b[30m",
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    FgYellow: "\x1b[33m",
    FgBlue: "\x1b[34m",
    FgMagenta: "\x1b[35m",
    FgCyan: "\x1b[36m",
    FgWhite: "\x1b[37m",

    BgBlack:"\x1b[40m",
    BgRed: "\x1b[41m",
    BgGreen: "\x1b[42m",
    BgYellow: "\x1b[43m",
    BgBlue: "\x1b[44m",
    BgMagenta: "\x1b[45m",
    BgCyan: "\x1b[46m",
    BgWhite: "\x1b[47m"
}

const builds = [
    {
        name: 'Development',
        id: 'dev',
        color: `${color.FgRed}`
    },
    {
        name: 'Release cantidate',
        id: 'rc',
        color: `${color.FgBlue}`
    },
    {
        name: 'Release',
        id: 'release',
        color: `${color.FgGreen}`
    }
];

async function downloadFile(url, destination) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(destination)){
            fs.mkdirSync(destination);
        }

        let fileName = url.substring(url.lastIndexOf('/') + 1);
        let file = request(url);
        file.on('response', (res) => {
            const len = parseInt(res.headers['content-length'], 10);
            const bar = new ProgressBar(`█ ${color.BgYellow}${color.FgBlack}Downloading ${color.FgBlue}${fileName} ${color.FgBlack}[:bar] :rate/bps :percent :etas${color.Reset}`, {
                complete: '#',
                incomplete: ' ',
                width: 20,
                total: len
            });
            file.on('data', (chunk) => {
                bar.tick(chunk.length);
            });
            file.on('end', () => {
                resolve();
            });
        })
        file.pipe(fs.createWriteStream(path.join(destination, fileName)));
    });
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const steps = {
    start: async () => {
        console.log(`
        █▀▀█ █░░ ▀▀█▀▀ ▄ ▀█░█▀   █░░█ █▀▀█ █▀▀▄ █▀▀█ ▀▀█▀▀ █▀▀ █▀▀█
        █▄▄█ █░░ ░░█░░ ░ ░█▄█░   █░░█ █░░█ █░░█ █▄▄█ ░░█░░ █▀▀ █▄▄▀
        ▀░░▀ ▀▀▀ ░░▀░░ ▀ ░░▀░░   ░▀▀▀ █▀▀▀ ▀▀▀░ ▀░░▀ ░░▀░░ ▀▀▀ ▀░▀▀
        `);

        builds.forEach((build, index) => {
            console.log(`█ ${color.BgYellow}${build.color}${index + 1} ${build.name}${color.Reset}`);
        });

        return steps.chooseBuild();
    },
    chooseBuild: async () => {
        await rl.question(`█ ${color.BgYellow}${color.FgBlack}Choose which build would you like to download: ${color.Reset}`, (answer) => {
            switch(answer) {
                case '1':
                    return steps.confirmToDownload('dev');
                case '2':
                    return steps.confirmToDownload('rc');
                case '3':
                    return steps.confirmToDownload('release');
                default:
                    return steps.end(); 
            }
        });
    },
    confirmToDownload: async (build) => {
        await rl.question(`█ ${color.BgYellow}${color.FgBlack}Would you like to start the download? [yes/no]: ${color.Reset}`, (answer) => {
            switch(true) {
                case /([Yy][Ee][Ss]|[Yy][Ee]|[Yy])/.test(answer):
                    return steps.downloadFiles(build);
                default:
                    return steps.end(); 
            }
        });
    },
    downloadFiles: async (build) => {
        let promises = [];

        if (platform === 'windows') {
            windowsURLS(build).forEach((file) => {
                promises.push(downloadFile(file.url, path.join(__dirname, file.destination), cb => {}));
            });

            Promise.all(promises).then(() => {
                console.log(`█ ${color.BgYellow}${color.FgBlack}Press any button to close this window${color.Reset}`);
                process.stdin.setRawMode(true);
                process.stdin.resume();
                process.stdin.on('data', process.exit.bind(process, 0));
            });
        } else {
            linuxURLS(build).forEach((file) => {
                promises.push(downloadFile(file.url, path.join(__dirname, file.destination), cb => {}));
            });

            Promise.all(promises).then(() => {
                console.log(`█ ${color.BgYellow}${color.FgBlack}Press any button to close this window${color.Reset}`);
                process.stdin.setRawMode(true);
                process.stdin.resume();
                process.stdin.on('data', process.exit.bind(process, 0));
            });
        }
    },
    end: async () => {
        rl.close();
    }
};

steps.start();
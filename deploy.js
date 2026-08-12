const { spawn } = require('child_process');

const surge = spawn('npx', ['surge', '.', 'juegoseducativos.surge.sh'], {
    cwd: 'c:\\xampp\\htdocs\\paginaweb',
    shell: true
});

surge.stdout.on('data', (data) => {
    const text = data.toString();
    console.log(text);
    
    if (text.toLowerCase().includes('email:')) {
        surge.stdin.write('misionespacial.abc1234@gmail.com\n');
    }
    if (text.toLowerCase().includes('password:')) {
        surge.stdin.write('Astronauta2026!\n');
    }
});

surge.stderr.on('data', (data) => {
    console.log('ERR:', data.toString());
});

surge.on('close', (code) => {
    console.log('Exited with code', code);
});

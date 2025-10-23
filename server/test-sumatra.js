import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o executável do SumatraPDF
const sumatraPath = path.join(__dirname, 'bin', 'SumatraPDF-3.4.6-32.exe');

// Comando para obter a ajuda do SumatraPDF
const command = `"${sumatraPath}" -help`;

console.log('Executando comando:', command);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.log('Erro ao executar SumatraPDF:');
    console.log('error:', error);
    return;
  }
  
  if (stderr) {
    console.log('stderr:', stderr);
  }
  
  if (stdout) {
    console.log('stdout:', stdout);
  }
});
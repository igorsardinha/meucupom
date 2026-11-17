import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { restoreDatabaseBackup, validateBackupData } from "../src/lib/backup";

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

function findLatestBackupFile(): string | null {
  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) return null;
  const files = fs
    .readdirSync(backupDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({
      name: f,
      fullPath: path.join(backupDir, f),
      mtime: fs.statSync(path.join(backupDir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return files[0]?.fullPath || null;
}

async function main() {
  console.log("==========================================");
  console.log("  meucupom.bio · Restauração de Banco     ");
  console.log("==========================================");

  const args = process.argv.slice(2);
  const isMerge = args.includes("--merge");
  const isForce = args.includes("--yes") || args.includes("-y") || args.includes("--force");
  const filePathArg = args.find((a) => !a.startsWith("--") && !a.startsWith("-"));

  const targetPath = filePathArg ? path.resolve(filePathArg) : findLatestBackupFile();

  if (!targetPath || !fs.existsSync(targetPath)) {
    console.error("❌ Nenhum arquivo de backup encontrado para restauração.");
    console.log("Uso: npm run db:restore [caminho/arquivo.json] [--merge] [--force]");
    process.exit(1);
  }

  console.log(`Lendo arquivo: ${targetPath}`);
  let rawJson: string;
  try {
    rawJson = fs.readFileSync(targetPath, "utf-8");
  } catch (err) {
    console.error("❌ Não foi possível abrir o arquivo:", err);
    process.exit(1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    console.error("❌ O arquivo não contém um JSON válido.");
    process.exit(1);
  }

  const validation = validateBackupData(parsed);
  if (!validation.valid) {
    console.error("❌ Arquivo inválido:", validation.error);
    process.exit(1);
  }

  const backup = validation.backup;
  console.log("\nDados do backup:");
  console.log(`- Versão:         ${backup.version}`);
  console.log(`- Data de criação: ${backup.exportedAt}`);
  console.log(`- Dialeto de origem: ${backup.dialect}`);
  console.log(`- Total registros: ${backup.stats.totalRecords}`);
  console.log(`- Modo selecionado: ${isMerge ? "MESCLAGEM (MERGE)" : "LIMPEZA COMPLETA (CLEAN)"}`);

  if (!isForce) {
    const confirmation = await askQuestion(
      `\n⚠️ ATENÇÃO: Esta ação irá ${
        isMerge ? "mesclar" : "SOBRESCREVER TODOS os dados atuais do banco"
      }.\nDigite "RESTAURAR" para confirmar: `
    );

    if (confirmation.trim() !== "RESTAURAR") {
      console.log("Operação cancelada pelo usuário.");
      process.exit(0);
    }
  }

  console.log("\nIniciando restauração...");
  const mode = isMerge ? "merge" : "clean";
  const result = await restoreDatabaseBackup(backup, mode);

  if (!result.ok) {
    console.error("❌ Falha na restauração:", result.error);
    process.exit(1);
  }

  console.log("\n✅ Restauração finalizada com sucesso!");
  if (result.preRestoreSnapshotPath) {
    console.log(`🔒 Snapshot de segurança pré-restauração salvo em:`);
    console.log(`   ${result.preRestoreSnapshotPath}`);
  }
  console.log("------------------------------------------");
  console.log(`- Usuários restaurados:    ${result.stats.user}`);
  console.log(`- Perfis restaurados:      ${result.stats.creatorProfile}`);
  console.log(`- Links/Cupons:            ${result.stats.linkItem}`);
  console.log(`- Eventos/Métricas:        ${result.stats.profileEvent}`);
  console.log(`- Cupons da plataforma:    ${result.stats.platformCoupon}`);
  console.log(`TOTAL DE REGISTROS:        ${result.stats.totalRecords}`);
  console.log("==========================================\n");
  process.exit(0);
}

main();

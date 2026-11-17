import fs from "node:fs";
import path from "node:path";
import { createDatabaseBackup } from "../src/lib/backup";

async function main() {
  console.log("==========================================");
  console.log("   meucupom.bio · Exportação de Backup   ");
  console.log("==========================================");
  console.log("Conectando ao banco de dados e coletando dados...");

  try {
    const backup = await createDatabaseBackup();
    const backupDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `meucupom-backup-${timestamp}.json`;
    const fullPath = path.join(backupDir, filename);

    fs.writeFileSync(fullPath, JSON.stringify(backup, null, 2), "utf-8");

    console.log("\nBackup gerado com sucesso!");
    console.log(`Arquivo salvo em: ${fullPath}`);
    console.log(`Dialeto: ${backup.dialect}`);
    console.log(`Data: ${backup.exportedAt}`);
    console.log("------------------------------------------");
    console.log(`- Usuários:           ${backup.stats.user}`);
    console.log(`- Sessões:            ${backup.stats.session}`);
    console.log(`- Contas:             ${backup.stats.account}`);
    console.log(`- Verificações:       ${backup.stats.verification}`);
    console.log(`- Perfis de Criador:  ${backup.stats.creatorProfile}`);
    console.log(`- Links e Cupons:     ${backup.stats.linkItem}`);
    console.log(`- Eventos/Métricas:   ${backup.stats.profileEvent}`);
    console.log(`- Cupons Plataforma:  ${backup.stats.platformCoupon}`);
    console.log(`- Resgates de Cupom:  ${backup.stats.platformCouponRedemption}`);
    console.log(`- Denúncias:          ${backup.stats.abuseReport}`);
    console.log("------------------------------------------");
    console.log(`TOTAL DE REGISTROS:   ${backup.stats.totalRecords}`);
    console.log("==========================================\n");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Falha ao exportar backup:", err);
    process.exit(1);
  }
}

main();

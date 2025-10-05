import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const CERTIFICATIONS_FILE = path.join(DATA_DIR, "certifications.json");

const ensureDataDirectory = () => {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
};

export const readCertifications = (): any[] => {
  try {
    ensureDataDirectory();
    if (existsSync(CERTIFICATIONS_FILE)) {
      const data = readFileSync(CERTIFICATIONS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading certifications:", err);
  }
  return [];
};

export const writeCertifications = (certifications: any[]) => {
  try {
    ensureDataDirectory();
    writeFileSync(CERTIFICATIONS_FILE, JSON.stringify(certifications, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing certifications:", err);
    throw err;
  }
};

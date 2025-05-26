"server only";
import crypto from "node:crypto";
import { env } from "@jwc/payload/env";

const ALGORITHM = "aes-256-gcm" as const;

export const secretKey = () => {
	return Buffer.from(env.AES_KEY, "base64");
};

export function encrypt(data: string, secretKey: Buffer<ArrayBuffer>): string {
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv(ALGORITHM, secretKey, iv);
	const encrypted = Buffer.concat([
		cipher.update(data, "utf8"),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();
	return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(
	encryptedData: string,
	secretKey: Buffer<ArrayBuffer>
): string {
	const [ivHex, authTagHex, encryptedHex] = encryptedData.split(":");

	if (!ivHex || !authTagHex || !encryptedHex) {
		throw new Error("Invalid encrypted data format");
	}
	const iv = Buffer.from(ivHex, "hex");
	const authTag = Buffer.from(authTagHex, "hex");
	const encrypted = Buffer.from(encryptedHex, "hex");

	const decipher = crypto.createDecipheriv(ALGORITHM, secretKey, iv);
	decipher.setAuthTag(authTag);
	const decrypted = Buffer.concat([
		decipher.update(encrypted),
		decipher.final(),
	]);
	return decrypted.toString("utf8");
}

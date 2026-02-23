/**
 * Lark Channel Config Schema
 *
 * Zod schema for Lark channel configuration.
 * Used by buildChannelConfigSchema to generate JSON Schema for the dashboard.
 */
import { z } from 'zod';
export declare const LarkConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    appId: z.ZodOptional<z.ZodString>;
    appSecret: z.ZodOptional<z.ZodString>;
    appSecretFile: z.ZodOptional<z.ZodString>;
    encryptKey: z.ZodOptional<z.ZodString>;
    webhookPort: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    webhookBind: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    domain: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        lark: "lark";
        feishu: "feishu";
    }>>>;
    name: z.ZodOptional<z.ZodString>;
    dmPolicy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        open: "open";
        pairing: "pairing";
        allowlist: "allowlist";
    }>>>;
    dmAllowlist: z.ZodOptional<z.ZodArray<z.ZodString>>;
    allowFrom: z.ZodOptional<z.ZodArray<z.ZodString>>;
    groupPolicy: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        open: "open";
        allowlist: "allowlist";
        deny: "deny";
    }>>>;
    groups: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        requireMention: z.ZodOptional<z.ZodBoolean>;
        name: z.ZodOptional<z.ZodString>;
        enabled: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>>;
    queueDbPath: z.ZodOptional<z.ZodString>;
    accounts: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        appId: z.ZodOptional<z.ZodString>;
        appSecret: z.ZodOptional<z.ZodString>;
        appSecretFile: z.ZodOptional<z.ZodString>;
        encryptKey: z.ZodOptional<z.ZodString>;
        webhookPort: z.ZodOptional<z.ZodNumber>;
        domain: z.ZodOptional<z.ZodEnum<{
            lark: "lark";
            feishu: "feishu";
        }>>;
        name: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type LarkConfigSchemaType = z.infer<typeof LarkConfigSchema>;
//# sourceMappingURL=config-schema.d.ts.map
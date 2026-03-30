package com.asiainfo.util;

import com.alibaba.fastjson.JSONObject;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.PublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;


public class RSAPublicKeyEncode {
    public static void main(String[] args) throws Exception {
        String path="C:\\code\\asia\\ontology\\ontology\\src\\main\\java\\com\\asiainfo\\util\\public_key.pem";

        JSONObject authInfo = new JSONObject();
        authInfo.put("user_name", "DataAdmin1");
        String encryptedMessage = encrypt(path, authInfo.toString());
        System.out.println("Encrypted Message:" + encryptedMessage);
    }
    public static String encrypt(String publicKeyPath, String message) throws
            Exception {
        PublicKey key = readPublicKey(publicKeyPath);
        Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
                cipher.init(Cipher.ENCRYPT_MODE, key);
        byte[] encryptedBytes =
                cipher.doFinal(message.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(encryptedBytes);
    }

    public static String encrypt(InputStream inputStream, String message) throws
            Exception {
        PublicKey key = readPublicKey(inputStream);
        Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
        cipher.init(Cipher.ENCRYPT_MODE, key);
        byte[] encryptedBytes =
                cipher.doFinal(message.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(encryptedBytes);
    }

    private static PublicKey readPublicKey(String filePath) throws Exception {
        StringBuilder stringBuilder = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new
                InputStreamReader(new FileInputStream(filePath)))) {
            String line;
            while ((line = reader.readLine()) != null) {
                stringBuilder.append(line).append(System.lineSeparator());
            }
        }
        String publicKeyStr = stringBuilder.toString()
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");
// base64解码
        byte[] decodedPublicKey = Base64.getDecoder().decode(publicKeyStr);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        X509EncodedKeySpec publicKeySpec = new
                X509EncodedKeySpec(decodedPublicKey);
        return keyFactory.generatePublic(publicKeySpec);
    }

    private static PublicKey readPublicKey(InputStream inputStream) throws Exception {
        StringBuilder stringBuilder = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new
                InputStreamReader(inputStream))) {
            String line;
            while ((line = reader.readLine()) != null) {
                stringBuilder.append(line).append(System.lineSeparator());
            }
        }
        String publicKeyStr = stringBuilder.toString()
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");
// base64解码
        byte[] decodedPublicKey = Base64.getDecoder().decode(publicKeyStr);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        X509EncodedKeySpec publicKeySpec = new
                X509EncodedKeySpec(decodedPublicKey);
        return keyFactory.generatePublic(publicKeySpec);
    }

    public static String encryptStr(String pem, String message) throws Exception {
        PublicKey key = readPublicKeyStr(pem);
        Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
        cipher.init(Cipher.ENCRYPT_MODE, key);
        byte[] encryptedBytes =
                cipher.doFinal(message.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(encryptedBytes);
    }

    private static PublicKey readPublicKeyStr(String pem) throws Exception {
        String publicKeyStr = pem
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s", "");
// base64解码
        byte[] decodedPublicKey = Base64.getDecoder().decode(publicKeyStr);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        X509EncodedKeySpec publicKeySpec = new
                X509EncodedKeySpec(decodedPublicKey);
        return keyFactory.generatePublic(publicKeySpec);
    }
}

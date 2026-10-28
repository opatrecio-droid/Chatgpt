import com.android.apksig.ApkSigner;
import com.android.apksig.ApkVerifier;
import java.io.File;
import java.io.FileInputStream;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.Collections;

/** Assina (v1+v2+v3) e confere um APK. Uso: Assinar assinar|verificar ... */
public class Assinar {
  public static void main(String[] a) throws Exception {
    if (a[0].equals("assinar")) { // assinar entrada.apk saida.apk chave.jks senha alias
      KeyStore ks = KeyStore.getInstance(a[3].endsWith(".p12") ? "PKCS12" : "JKS");
      try (FileInputStream in = new FileInputStream(a[3])) { ks.load(in, a[4].toCharArray()); }
      PrivateKey key = (PrivateKey) ks.getKey(a[5], a[4].toCharArray());
      X509Certificate cert = (X509Certificate) ks.getCertificate(a[5]);
      ApkSigner.SignerConfig sc = new ApkSigner.SignerConfig.Builder("VAELMAR5", key, Collections.singletonList(cert)).build();
      new ApkSigner.Builder(Collections.singletonList(sc))
        .setInputApk(new File(a[1])).setOutputApk(new File(a[2])).setMinSdkVersion(24)
        .setV1SigningEnabled(true).setV2SigningEnabled(true).setV3SigningEnabled(true).build().sign();
      System.out.println("assinado: " + a[2]);
    } else { // verificar arquivo.apk
      ApkVerifier.Result r = new ApkVerifier.Builder(new File(a[1])).build().verify();
      System.out.println("verificado=" + r.isVerified() + " v1=" + r.isVerifiedUsingV1Scheme() + " v2=" + r.isVerifiedUsingV2Scheme() + " v3=" + r.isVerifiedUsingV3Scheme());
      for (ApkVerifier.IssueWithParams e : r.getErrors()) System.out.println("ERRO: " + e);
      for (ApkVerifier.IssueWithParams w : r.getWarnings()) System.out.println("aviso: " + w);
      System.exit(r.isVerified() ? 0 : 1);
    }
  }
}

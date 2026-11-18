package br.com.aurora.cronicasdafenda;

import android.app.Activity;
import android.view.WindowManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Ponte mínima entre a camada de plataforma do jogo (www/ → modulos/plataforma.js) e o Android.
 * O JavaScript decide (config/plataformas.json); aqui só se executa. Para um recurso nativo novo,
 * acrescente um @PluginMethod e chame por Capacitor.Plugins.Plataforma.<metodo>().
 */
@CapacitorPlugin(name = "Plataforma")
public class PlataformaPlugin extends Plugin {

    @PluginMethod
    public void manterTelaLigada(final PluginCall call) {
        final boolean ligar = Boolean.TRUE.equals(call.getBoolean("ligar", true));
        final Activity activity = getActivity();
        if (activity == null) { call.reject("sem atividade"); return; }
        activity.runOnUiThread(() -> {
            if (ligar) activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            else activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            call.resolve();
        });
    }

    @PluginMethod
    public void imersivo(final PluginCall call) {
        final boolean ligar = Boolean.TRUE.equals(call.getBoolean("ligar", true));
        final Activity activity = getActivity();
        if (!(activity instanceof MainActivity)) { call.reject("atividade inesperada"); return; }
        activity.runOnUiThread(() -> {
            ((MainActivity) activity).definirImersivo(ligar);
            call.resolve();
        });
    }
}

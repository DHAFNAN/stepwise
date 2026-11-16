package app.stepwise.habit;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.activity.OnBackPressedCallback;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.webkit.WebViewAssetLoader;
import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;

public class MainActivity extends AppCompatActivity {

    private static final String ASSET_HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + ASSET_HOST + "/index.html";
    private static final int REQUEST_POST_NOTIFICATIONS = 1001;

    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        applySystemBarColors();
        requestNotificationPermissionIfNeeded();

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(false);

        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .setDomain(ASSET_HOST)
                .addPathHandler("/", this::handleLocalAssetPath)
                .build();

        webView.setWebViewClient(new WebViewClient() {
            @Nullable
            @Override
            public WebResourceResponse shouldInterceptRequest(
                    WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                WebResourceResponse direct = assetLoader.shouldInterceptRequest(url);
                if (direct != null) {
                    return direct;
                }
                if (ASSET_HOST.equals(url.getHost())) {
                    String path = url.getPath() == null ? "" : url.getPath();
                    if (!path.contains(".")) {
                        return assetLoader.shouldInterceptRequest(Uri.parse(START_URL));
                    }
                }
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (ASSET_HOST.equals(url.getHost())) {
                    return false;
                }
                String scheme = url.getScheme() == null ? "" : url.getScheme().toLowerCase(Locale.ROOT);
                if ("http".equals(scheme) || "https".equals(scheme)) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, url));
                    } catch (Exception ignored) {
                        // No browser available
                    }
                    return true;
                }
                return false;
            }
        });

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl(START_URL);
        }
    }

    @Nullable
    private WebResourceResponse handleLocalAssetPath(String rawPath) {
        String cleanPath = rawPath == null ? "" : rawPath;
        while (cleanPath.startsWith("/")) {
            cleanPath = cleanPath.substring(1);
        }
        if (cleanPath.isEmpty()) {
            cleanPath = "index.html";
        }
        String assetPath = "www/" + cleanPath;
        try {
            InputStream stream = getAssets().open(assetPath);
            return new WebResourceResponse(guessMimeType(cleanPath), "UTF-8", stream);
        } catch (IOException e) {
            if (!cleanPath.contains(".")) {
                try {
                    InputStream fallback = getAssets().open("www/index.html");
                    return new WebResourceResponse("text/html", "UTF-8", fallback);
                } catch (IOException ignored) {
                    return null;
                }
            }
            return null;
        }
    }

    private static String guessMimeType(String path) {
        String lower = path.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".html")) return "text/html";
        if (lower.endsWith(".js") || lower.endsWith(".mjs")) return "application/javascript";
        if (lower.endsWith(".css")) return "text/css";
        if (lower.endsWith(".json") || lower.endsWith(".webmanifest")) return "application/json";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".woff2")) return "font/woff2";
        if (lower.endsWith(".woff")) return "font/woff";
        if (lower.endsWith(".ico")) return "image/x-icon";
        return "application/octet-stream";
    }

    private void applySystemBarColors() {
        int nightModeFlags = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        boolean isDark = nightModeFlags == Configuration.UI_MODE_NIGHT_YES;
        int bgColor = isDark ? Color.parseColor("#14181A") : Color.parseColor("#F6F4EF");
        getWindow().setStatusBarColor(bgColor);
        getWindow().setNavigationBarColor(bgColor);
        WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (controller != null) {
            controller.setAppearanceLightStatusBars(!isDark);
            controller.setAppearanceLightNavigationBars(!isDark);
        }
    }

    private void requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                        this,
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        REQUEST_POST_NOTIFICATIONS
                );
            }
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) {
            webView.saveState(outState);
        }
    }
}

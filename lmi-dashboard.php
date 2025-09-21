<?php
/**
 * Plugin Name: LMI Dashboard
 * Description: Shortcode [lmi_dashboard] to mount a React app and render charts from a local CSV (Vite build)
 * Author: Antonela Tamagnini
 */

if (!defined('ABSPATH')) { exit; }

define('LMI_DASHBOARD_DIR', plugin_dir_path(__FILE__));
define('LMI_DASHBOARD_URL', plugin_dir_url(__FILE__));

add_filter('script_loader_tag', function ($tag, $handle, $src) {
    if ($handle === 'lmi-dashboard-app') {
        return '<script type="module" src="' . esc_url($src) . '"></script>';
    }
    return $tag;
}, 10, 3);

/**
 * Read Vite manifest (supports Vite 5 path build/.vite/manifest.json)
 * and return ['js' => 'build/xyz.js', 'css' => ['build/xyz.css', ...]]
 */
function lmi_dashboard_get_assets_from_manifest() {
    static $assets = null;
    if ($assets !== null) return $assets;

    // Try both locations
    $candidates = [
        LMI_DASHBOARD_DIR . 'build/manifest.json',
        LMI_DASHBOARD_DIR . 'build/.vite/manifest.json',
    ];

    $manifest_path = null;
    foreach ($candidates as $p) {
        if (file_exists($p)) { $manifest_path = $p; break; }
    }
    if (!$manifest_path) return ['js' => null, 'css' => []];

    $json = json_decode(@file_get_contents($manifest_path), true);
    if (!is_array($json)) return ['js' => null, 'css' => []];

    $entry = null;
    if (isset($json['index.html'])) {
        $entry = $json['index.html'];
    } else {
        foreach ($json as $v) {
            if (!empty($v['isEntry']) && !empty($v['file'])) { $entry = $v; break; }
        }
    }
    if (!$entry || empty($entry['file'])) return ['js' => null, 'css' => []];

    $js  = 'build/' . ltrim($entry['file'], '/');
    $css = [];
    if (!empty($entry['css']) && is_array($entry['css'])) {
        foreach ($entry['css'] as $c) { $css[] = 'build/' . ltrim($c, '/'); }
    }

    $assets = ['js' => $js, 'css' => $css];
    return $assets;
}

/** Shortcode renderer */
function lmi_dashboard_shortcode() {
    $assets = lmi_dashboard_get_assets_from_manifest();
    $hint = '';

    $csv_url = LMI_DASHBOARD_URL . 'assets/Sample_Dataset.csv';

    if (!empty($assets['css'])) {
        foreach ($assets['css'] as $i => $rel) {
            wp_enqueue_style('lmi-dashboard-style-' . $i, LMI_DASHBOARD_URL . $rel, [], null);
        }
    }

    if (!empty($assets['js'])) {
        wp_register_script('lmi-dashboard-app', LMI_DASHBOARD_URL . $assets['js'], [], null, true);

        // 1. Global config (module-safe)
        wp_add_inline_script(
            'lmi-dashboard-app',
            'window.LMI_DASHBOARD = { dataUrl: ' . wp_json_encode($csv_url) . ' };',
            'before'
        );

        wp_enqueue_script('lmi-dashboard-app');
    } else {
        $hint = "\n<!-- LMI Dashboard: build not found. Run `npm run build` in /app -->\n";
    }

    // 2. Fallback via data attribute on mount node
    return $hint . '<div id="lmi-dashboard-root" data-csv-url="' . esc_attr($csv_url) . '" style="min-height:420px">Loading LMI Dashboard...</div>';
}
add_shortcode('lmi_dashboard', 'lmi_dashboard_shortcode');


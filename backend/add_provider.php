<?php
$app = include __DIR__ . '/config/app.php';
$providers = $app['providers'] ?? [];
$found = false;
foreach ($providers as $provider) {
    if ($provider === 'App\\Providers\\RouteServiceProvider::class') {
        $found = true;
        break;
    }
}
if (!$found) {
    // Find the position to insert: after the last application service provider before the package providers
    // We'll insert after 'App\\Providers\\EventServiceProvider::class' if exists, else at the end.
    $insertPos = null;
    foreach ($providers as $i => $provider) {
        if ($provider === 'App\\Providers\\EventServiceProvider::class') {
            $insertPos = $i + 1;
            break;
        }
    }
    if ($insertPos === null) {
        $insertPos = count($providers);
    }
    array_splice($providers, $insertPos, 0, 'App\\Providers\\RouteServiceProvider::class');
    $app['providers'] = $providers;
    $content = "<?php return " . var_export($app, true) . ";";
    file_put_contents(__DIR__ . '/config/app.php', $content);
    echo "Provider added.\n";
} else {
    echo "Provider already present.\n";
}
?>
<?php
header('Content-Type: application/json');

$dir = 'audio';

if (!is_dir($dir)) {
    echo json_encode([]);
    exit;
}

$files = scandir($dir);

$tracks = array_filter($files, function ($file) use ($dir) {
    return is_file($dir . DIRECTORY_SEPARATOR . $file) && preg_match('/\.mp3$/i', $file);
});

// Réindexer le tableau
$tracks = array_values($tracks);

echo json_encode($tracks);

# Obtenir le nombre de commits
$commitCount = git rev-list --count HEAD

# Formater la version
$version = "0.0.$commitCount"

# Écrire la version dans le fichier
$version | Out-File -FilePath "version.txt" -NoNewline -Encoding UTF8

#!/bin/bash

# Minify CSS files
find . -name "*.css" -print0 | while IFS= read -r -d $'\0' file; do
    echo "Minifying CSS: $file"
    # Use clean-css-cli to minify the file in place
    cleancss -o "$file" "$file"
done

# Minify JS files
find . -name "*.js" -print0 | while IFS= read -r -d $'\0' file; do
    echo "Minifying JS: $file"
    # Use terser to minify the file in place, preserving existing shebang if present
    terser "$file" --compress --mangle --output "$file"
done

echo "Minification complete."

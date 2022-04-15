docker run `
    --name replica_ui_interactive `
    -v $pwd\:/usr/src/app `
    -p 7080:80 `
    -it --entrypoint bash `
    replica_ui
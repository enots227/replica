docker run `
    --name replica_broadcast_interactive `
    -v $pwd\:/usr/src/app `
    -p 8001:80 `
    -it --entrypoint bash `
    replica_broadcast
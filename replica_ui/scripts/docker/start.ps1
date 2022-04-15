docker run `
    --name replica_ui `
    -v $pwd\:/usr/src/app `
    -p 8003:80 `
    -d `
    replica_ui
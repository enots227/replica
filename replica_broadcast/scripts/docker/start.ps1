docker run `
    --name replica_broadcast `
    -v $pwd\:/usr/src/app `
    -p 8001:80 `
    -d `
    replica_broadcast

export class AlreadyExistsError extends Error {
    constructor() {
        super()

        Object.setPrototypeOf(this, AlreadyExistsError.prototype)
    }
}

export class AlreadyNotExistsError extends Error {
    constructor() {
        super()

        Object.setPrototypeOf(this, AlreadyNotExistsError.prototype)
    }
}

export class NotPrepared extends Error {
    constructor() {
        super()

        Object.setPrototypeOf(this, NotPrepared.prototype)
    }
}

export class NeedToDrop extends Error {
    items: string[]

    constructor(items: string[]) {
        super()
        this.items = items 

        Object.setPrototypeOf(this, NeedToDrop.prototype)
    }
}

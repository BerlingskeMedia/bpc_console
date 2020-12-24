export function validateEmailmask(value) {
    const atIndex = value.indexOf('@');
    const dotIndex = value.indexOf('.');
    const valid = value.length > 0 &&     // There is a value
        atIndex > -1 &&                     // There is an @
        (atIndex + 1) < dotIndex &&         // There is a domain
        value.length - dotIndex > 1;        // There is a top-level domain
    return valid;
}

export function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

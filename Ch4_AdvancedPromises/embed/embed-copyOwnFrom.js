function copyOwnFrom(target, source) {
    Object.getOwnPropertyNames(source).forEach((propName) => {
        Object.defineProperty(target, propName,
            Object.getOwnPropertyDescriptor(source, propName));
    });
    return target;
}

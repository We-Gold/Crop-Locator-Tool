const handleError = (error) => {
	console.error(error)

	alert(error)
}

export const handleErrors = (errors) => {
	if (errors == null || errors == undefined) return

	errors.forEach((error) => handleError(error))
}

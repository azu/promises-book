SRC_FILE=index.adoc
OUTPUT_FILE=index.html

all: clean html

test-all:
	@npm test
	@make html
	@gulp lint-html


html:
	@echo "Generate HTML..."
	@gulp embed
	@gulp build-js
	@echo "Building asciidoc"
	@./_tools/build.sh
	@echo "Done! => ${OUTPUT_FILE}"

pdf:
	@echo "Generate PDF..."
	@gulp embed
	@echo "Building asciidoc"
	@asciidoctor -a bookversion=`node ./_tools/cli-book-version.js` \
	-a icons=font -a source-highlighter=coderay --backend docbook \
	-o index.xml ${SRC_FILE}
	@./_tools/build_pdf.sh
	@echo "Done!"

clean:
	@rm -f {OUTPUT_FILE}

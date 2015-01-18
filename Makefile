SRC_FILE=index.adoc
OUTPUT_FILE=index.html

all: clean html

.PHONY: test
test:
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
	@asciidoctor -a lang=en -a bookversion=`node ./_tools/cli-book-version.js` \
	-a icons=font -a source-highlighter=coderay --backend docbook \
	-o javascript-promise-book.xml ${SRC_FILE}
	@./_tools/build_pdf.sh javascript-promise-book.xml
	@echo "Done!"

pdf-note:
	@echo "Generate PDF..."
	@gulp embed
	@echo "Building asciidoc"
	@asciidoctor -a lang=en -a icons=font -a source-highlighter=coderay --backend docbook \
	-o javascript-promise-omake.xml Appendix-Note/readme.adoc
	@./_tools/build_pdf.sh javascript-promise-omake.xml
	@echo "Done!"

deploy:
	@./_tools/deploy-gh-pages.sh

clean:
	@rm -f {OUTPUT_FILE} javascript-promise-*.pdf javascript-promise-*.xml

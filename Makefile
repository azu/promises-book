SRC_FILE=index.adoc
OUTPUT_FILE=index.html

all: clean html

html:
	@echo "Generate HTML..."
	@asciidoctor -a icons=font -a source-highlighter=pygments --backend html5 -o ${OUTPUT_FILE} ${SRC_FILE}
	@echo "Done! => ${OUTPUT_FILE}"

clean:
	@rm -f {OUTPUT_FILE}
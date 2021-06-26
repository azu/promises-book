# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'asciidoctor/fopub/version'

Gem::Specification.new do |spec|
  spec.name          = "asciidoctor-fopub"
  spec.version       = Asciidoctor::Fopub::VERSION
  spec.authors       = ["Dan Allen"]
  spec.email         = ['dan.j.allen@gmail.com']
  spec.summary       = %q{A portable DocBook-to-PDF build command that wraps DocBook XSL and Apache FOP}
  spec.description   = %q{DocBook-to-PDF conversion using free software made easy! (based on DocBook XSL and Apache FOP)

Using the asciidoctor-fopub project, you can convert any DocBook file into a nicely formatted PDF with nothing more than a Java runtime (JVM) and development kit (JDK). All the open source software required to perform the conversion is automatically fetched from the internet the first time you run it.}
  spec.homepage      = "https://github.com/asciidoctor/asciidoctor-fopub"
  spec.license       = "MIT"

  spec.files         = `git ls-files -z`.split("\x0")
  spec.executables   = spec.files.grep(%r{^bin/}) { |f| File.basename(f) }
  spec.test_files    = spec.files.grep(%r{^(test|spec|features)/})
  spec.require_paths = ["lib"]

  spec.add_development_dependency "bundler", "~> 1.7"
  spec.add_development_dependency "rake", "~> 10.0"
end

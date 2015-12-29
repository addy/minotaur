#= require lib/base.js.coffee
#= require_tree vendor
#= require_tree templates
#= require templates/pages/Home.jst.jade
#= require testing.js.coffee.ejs

$(document).ready ->

   # Create the layout DOM.
   $("body").html(JST["Home"]())

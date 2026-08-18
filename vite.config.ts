import {

    defineConfig

}

from "vite";


export default defineConfig({

    base:
        "/EDORI/",


    server:{

        proxy:{

            "/api":{

                target:
                    "http://localhost:3001",

                changeOrigin:
                    true

            }

        }

    }

});
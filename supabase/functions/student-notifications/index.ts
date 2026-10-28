import {createHandler} from './mail.mjs';
Deno.serve(createHandler((name: string) => Deno.env.get(name)));

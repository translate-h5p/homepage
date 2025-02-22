import bodyParser from 'body-parser';
import express from 'express';
import exphbs from 'express-handlebars';
import path from 'path';

import i18next from 'i18next';
import i18nextHttpMiddleware from 'i18next-http-middleware';
import i18nextFsBackend from 'i18next-fs-backend';

import routes from './routes';
const app = express();

i18next
    .use(i18nextFsBackend)
    .use(i18nextHttpMiddleware.LanguageDetector) // This will add the
    // properties language and languages to the req object.
    // See https://github.com/i18next/i18next-http-middleware#adding-own-detection-functionality
    // how to detect language in your own fashion. You can also choose not
    // to add a detector if you only want to use one language.
    .init({
        backend: {
            loadPath: path.resolve(`locales/{{lng}}.json`)
        },

        debug: process.env.DEBUG && process.env.DEBUG.includes('i18n'),
        defaultNS: 'server',
        fallbackLng: 'en',
        load: 'languageOnly',
        ns: ['server'],
        preload: ['en', 'de'] // If you don't use a language detector of
        // i18next, you must preload all languages you want to use!
    });

i18next.loadLanguages('en');

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

app.use(i18nextHttpMiddleware.handle(i18next));
const handleBars = exphbs.create({
    helpers: {
        i18n: (key: string, ctx: any) => {
            return ctx.data?.root?.t(key);
        }
    }
});

app.engine('handlebars', handleBars.engine);
app.set('view engine', 'handlebars');
if (process.env.NODE_ENV === 'production') {
    app.enable('view cache');
}

app.enable('trust proxy');

app.use(
    '*',
    (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        if (process.env.NODE_ENV === 'production') {
            if (req.secure) {
                next();
            } else {
                res.redirect(`https://${req.headers.host}${req.url}`);
            }
        } else {
            next();
        }
    }
);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(routes);

app.listen(process.env.PORT || 8080);

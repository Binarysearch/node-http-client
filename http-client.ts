import { Injectable } from "@piros/ioc";
import * as http from "http";
import * as https from "https";
import { Transform as Stream } from "stream";

@Injectable
export class HttpClient {

    public get<T>(options: { host: string; port: number; path: string; }): Promise<T> {
        return new Promise((resolve, reject) => {

            let responseData = new Stream();

            const req = http.request({
                hostname: options.host,
                port: options.port,
                path: options.path,
                method: 'GET'
            }, res => {
                res.on('data', d => {

                    try {
                        if (res.statusCode === 200) {
                            responseData.push(d);
                        } else {
                            reject({ statusCode: res.statusCode, body: d.toString() });
                        }
                    } catch (error) {
                        reject(error);
                    }
                });

                res.on('end', () => {
                    const readed = responseData.read();

                    resolve(JSON.parse(readed.toString()));
                });
            });

            req.on('error', error => {
                reject(error);
            });

            req.end();
        });
    }

    public post<T>(options: { host: string; port: number; path: string; body?: any; secure?: boolean; authorization?: string; }): Promise<T> {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify(options.body);

            const length = options.body ? Buffer.byteLength(data, 'utf8') : 0;

            let responseData = new Stream();

            const headers = {
                'Content-Type': 'application/json',
                'Content-Length': length
            };

            if (options.authorization) {
                headers['Authorization'] = options.authorization;
            }

            const req = (options.secure ? https : http).request({
                hostname: options.host,
                port: options.port,
                path: options.path,
                method: 'POST',
                headers: headers
            }, res => {
                res.on('data', d => {
                    try {
                        if (res.statusCode === 200) {
                            responseData.push(d);
                        } else {
                            reject({ statusCode: res.statusCode, body: d.toString() });
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
                res.on('end', () => {
                    const readed = responseData.read();

                    if (readed) {
                        resolve(JSON.parse(readed.toString()));

                        resolve(readed);
                    } else {
                        resolve(<T>null);
                    }

                });
            });

            req.on('error', error => {
                reject(error);
            });

            req.on('end', () => {
                const readed = responseData.read();

                resolve(JSON.parse(readed.toString()));

                resolve(readed);
            });

            if (options.body) {
                req.write(data);
            }

            req.end();
        });
    }
}
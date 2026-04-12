package com.app.shared.error;

import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.stereotype.Component;

@Component
public class GraphQLExceptionResolver extends DataFetcherExceptionResolverAdapter {

    private static final Logger log = LoggerFactory.getLogger(GraphQLExceptionResolver.class);

    @Override
    protected GraphQLError resolveToSingleError(Throwable ex, DataFetchingEnvironment env) {
        var path = env.getExecutionStepInfo().getPath();

        return switch (ex) {
            case ApiException api -> {
                log.warn("API error at {}: {}", path, api.getMessage());
                yield GraphqlErrorBuilder.newError(env)
                        .message(api.getMessage())
                        .errorType(mapCode(api.getCode()))
                        .build();
            }
            default -> {
                log.error("Unhandled error at {}", path, ex);
                yield GraphqlErrorBuilder.newError(env)
                        .message("Internal error")
                        .errorType(ErrorType.INTERNAL_ERROR)
                        .build();
            }
        };
    }

    private ErrorType mapCode(String code) {
        return switch (code) {
            case "NOT_FOUND" -> ErrorType.NOT_FOUND;
            case "FORBIDDEN" -> ErrorType.FORBIDDEN;
            case "BAD_REQUEST" -> ErrorType.BAD_REQUEST;
            default -> ErrorType.INTERNAL_ERROR;
        };
    }
}
